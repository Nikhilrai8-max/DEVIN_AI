import 'dotenv/config';
import http from 'http';
import app from './app.js';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import projectModel from './models/project.model.js';
import { generateAgentProposal, generateResult } from './services/ai.service.js';

const port = process.env.PORT || 3000;



const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*'
    }
});


io.use(async (socket, next) => {

    try {

        const token = socket.handshake.auth?.token || socket.handshake.headers.authorization?.split(' ')[ 1 ];
        const projectId = socket.handshake.query.projectId;

        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            return next(new Error('Invalid projectId'));
        }


        socket.project = await projectModel.findById(projectId);


        if (!token) {
            return next(new Error('Authentication error'))
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded) {
            return next(new Error('Authentication error'))
        }


        socket.user = decoded;

        const isProjectMember = socket.project && (
            socket.project.owner.toString() === decoded.id ||
            socket.project.users.some(userId => userId.toString() === decoded.id)
        );
        if (!isProjectMember) {
            return next(new Error('Project access denied'));
        }

        next();

    } catch (error) {
        next(error)
    }

})


io.on('connection', socket => {
    socket.roomId = socket.project._id.toString()


    console.log('a user connected');



    socket.join(socket.roomId);

    socket.on('agent-request', async data => {
        const task = typeof data?.task === 'string' ? data.task.trim() : '';
        if (!task || task.length > 4000) {
            return socket.emit('agent-proposal', { error: 'Task must be between 1 and 4000 characters.' });
        }

        try {
            const project = await projectModel.findOne({
                _id: socket.project._id,
                users: socket.user.id,
            });
            if (!project) {
                return socket.emit('agent-proposal', { error: 'Project access denied.' });
            }

            const proposal = await generateAgentProposal(task, project.fileTree, data?.testOutput);
            io.to(socket.roomId).emit('agent-proposal', {
                proposal,
                baseFileTree: project.fileTree,
                requestedBy: { _id: socket.user.id, username: socket.user.username },
            });
        } catch (error) {
            socket.emit('agent-proposal', { error: error.message || 'The agent could not prepare a proposal.' });
        }
    });

    socket.on('project-message', async data => {

        const message = data.message;

        const aiIsPresentInMessage = message.includes('@ai');
        socket.broadcast.to(socket.roomId).emit('project-message', data)

        if (aiIsPresentInMessage) {


            try {
                const prompt = message.replace('@ai', '');

                const result = await generateResult(prompt);

                const aiMessage = typeof result === 'string' ? result : JSON.stringify(result ?? {})

                io.to(socket.roomId).emit('project-message', {
                    message: aiMessage,
                    sender: {
                        _id: 'ai',
                        email: 'AI'
                    }
                })
            } catch (err) {
                console.error('AI generation failed:', err.message);
                io.to(socket.roomId).emit('project-message', {
                    message: JSON.stringify({ text: "⚠️ AI Error: " + err.message }),
                    sender: {
                        _id: 'ai',
                        email: 'AI'
                    }
                })
            }

            return
        }


    })

    socket.on('disconnect', () => {
        console.log('user disconnected');
        socket.leave(socket.roomId)
    });
});




server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})